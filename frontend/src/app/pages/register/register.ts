import { Component } from '@angular/core';
//import { WORKSHOP } from 'src/app/config/workshop.config';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WORKSHOP } from '../../config/workshop.config';



declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill: { name: string; email: string; contact: string };
      theme: { color: string };
      modal: { ondismiss: () => void };
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
    }) => { open(): void };
  }
}

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  workshop = WORKSHOP;
  loading = false;
  paid = false;
  errorMessage = '';
  form = { fullName: '', email: '', phone: '', annualRevenue: '', experience: '' };
  registeredLater = false;


  constructor(private api: ApiService) { }

  async submit(formDirective: NgForm): Promise<void> {
    this.errorMessage = '';
    if (formDirective.invalid || this.loading) return;
    if (!window.Razorpay) {
      this.errorMessage = 'Payment checkout could not load. Refresh the page and try again.';
      return;
    }
    //Assigning as salary to annualRevenue in the payload to match the backend expectation
    this.loading = true;
    try {
      const registration = await this.api.createRegistration({
        fullName: this.form.fullName,
        email: this.form.email,
        phone: this.form.phone,
        annualRevenue: this.form.annualRevenue,
        experience: this.form.experience,
      });
      const order = await this.api.createOrder(registration.registrationId);

      const rawPhone = this.form.phone.replace(/\D/g, '');

      const contact = rawPhone.startsWith('91')
        ? `+${rawPhone}`
        : `+91${rawPhone}`;

      console.log('Phone passed to Razorpay:', contact);

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'TGS Business Success Summit',
        description: 'Workshop TGS Registration',
        order_id: order.orderId,
        prefill: { name: this.form.fullName, email: this.form.email, contact: contact },
        theme: { color: '#1760ed' },
        modal: { ondismiss: () => { this.loading = false; } },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          this.errorMessage = '';

          try {
            const result = await this.api.verifyPayment({
              registrationId: registration.registrationId,
              ...response
            });

            if (result.verified) {
              this.paid = true;
            } else {
              this.errorMessage = 'Payment could not be verified. Please contact support.';
            }
          } catch (error) {
            this.errorMessage =
              error instanceof Error
                ? error.message
                : 'Payment verification failed. Please contact support.';
          } finally {
            this.loading = false;
          }
        }
      });
      checkout.open();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to start payment. Please try again.';
      this.loading = false;
    }
  }

  async registerAndPayLater(): Promise<void> {
    this.errorMessage = '';

    if (this.loading) return;

    this.loading = true;

    try {
      await this.api.createRegistration({
        fullName: this.form.fullName,
        email: this.form.email,
        phone: this.form.phone,
        annualRevenue: this.form.annualRevenue,
        experience: this.form.experience,
      });

      this.registeredLater = true;
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to save your registration. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}

