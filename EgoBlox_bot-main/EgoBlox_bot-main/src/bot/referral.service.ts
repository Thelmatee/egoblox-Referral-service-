// Import necessary modules
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../database/schemas/user.schema';
import { Referral } from '../database/schemas/referral.schema';

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Referral') private readonly referralModel: Model<Referral>,
  ) {}

  /**
   * Generate a Referral Code for a User
   * @param userId - ID of the user requesting a referral code
   * @returns Generated referral code
   */
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Create a unique referral code
    const referralCode = `${userId}-${Date.now().toString(36)}`;
    user.referralCode = referralCode;

    await user.save();

    return referralCode;
  }

  /**
   * Register a Referral
   * @param referrerCode - Referral code of the inviter
   * @param referredUserId - ID of the referred user
   * @returns Referral confirmation
   */
  async registerReferral(referrerCode: string, referredUserId: string): Promise<any> {
    const referrer = await this.userModel.findOne({ referralCode: referrerCode });

    if (!referrer) {
      throw new Error('Referrer not found');
    }

    const referredUser = await this.userModel.findById(referredUserId);

    if (!referredUser) {
      throw new Error('Referred user not found');
    }

    // Log the referral
    const referral = new this.referralModel({
      referrerId: referrer._id,
      referredUserId,
      createdAt: new Date(),
    });

    await referral.save();

    // Reward the referrer
    await this.rewardReferrer(referrer._id);

    return {
      message: 'Referral registered successfully',
      referral,
    };
  }

  /**
   * Reward a Referrer
   * @param referrerId - ID of the referrer
   * @returns Reward confirmation
   */
  private async rewardReferrer(referrerId: string): Promise<void> {
    const referrer = await this.userModel.findById(referrerId);

    if (!referrer) {
      throw new Error('Referrer not found');
    }

    // Add reward points to the referrer
    const rewardPoints = 10; // Example reward points
    referrer.rewardPoints = (referrer.rewardPoints || 0) + rewardPoints;

    await referrer.save();
  }
}
